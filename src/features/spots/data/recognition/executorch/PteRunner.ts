import { Asset } from 'expo-asset';
import { loadModel, tensor, wrapAsync, type Model, type Tensor } from 'react-native-executorch';

/**
 * Fait tourner un modèle ExecuTorch (.pte) embarqué dans l'app.
 * Petit contrat à part : les adaptateurs (détecteur, classifieur) se testent avec un faux.
 */
export interface PteRunner {
  /** Une entrée float32, des sorties float32 dont on connaît la forme. */
  run(input: Float32Array, inputShape: readonly number[], outputShapes: readonly (readonly number[])[]): Promise<Float32Array[]>;
}

/** Ce dont l'exécuteur a besoin du moteur (remplaçable dans les tests). */
export interface ExecutorchApi {
  /** Chemin local du fichier .pte embarqué (require d'un asset). */
  resolvePath(assetModule: number): Promise<string>;
  load(path: string): Promise<Model>;
  execute(model: Model, inputs: Tensor[], outputs: Tensor[]): Promise<unknown>;
  tensor(shape: number[], data?: Float32Array): Tensor;
}

const loadAsync = wrapAsync(loadModel);
// Le calcul tourne sur un fil à part (worklet) : l'écran ne se fige pas.
const executeAsync = wrapAsync((model: Model, inputs: Tensor[], outputs: Tensor[]) => {
  'worklet';
  return model.execute('forward', inputs, outputs);
});

export const nativeExecutorchApi: ExecutorchApi = {
  async resolvePath(assetModule) {
    const [asset] = await Asset.loadAsync(assetModule);
    const uri = asset.localUri ?? asset.uri;
    return uri.replace(/^file:\/\//, '');
  },
  load: (path) => loadAsync(path),
  execute: (model, inputs, outputs) => executeAsync(model, inputs, outputs),
  tensor: (shape, data) => tensor('float32', shape, data),
};

export class ExecutorchPteRunner implements PteRunner {
  private model: Promise<Model> | null = null;

  constructor(
    private readonly assetModule: number,
    private readonly api: ExecutorchApi = nativeExecutorchApi,
  ) {}

  /** Chargé une seule fois et partagé ; un chargement raté n'est pas gardé (on réessaiera). */
  private load(): Promise<Model> {
    if (!this.model) {
      this.model = this.api
        .resolvePath(this.assetModule)
        .then((path) => this.api.load(path))
        .catch((error) => {
          this.model = null;
          throw error;
        });
    }
    return this.model;
  }

  async run(input: Float32Array, inputShape: readonly number[], outputShapes: readonly (readonly number[])[]): Promise<Float32Array[]> {
    const model = await this.load();
    const inputTensor = this.api.tensor([...inputShape], input);
    const outputs = outputShapes.map((shape) => this.api.tensor([...shape]));
    try {
      await this.api.execute(model, [inputTensor], outputs);
      return outputs.map((t) => t.getData(new Float32Array(t.numel)));
    } finally {
      inputTensor.dispose();
      outputs.forEach((t) => t.dispose());
    }
  }
}
