import { encode } from 'jpeg-js';

const mockManipulate = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: (...args: unknown[]) => mockManipulate(...args) },
  SaveFormat: { JPEG: 'jpeg' },
}));

import { base64ToBytes, ExpoPhotoPixelsReader, fitWithin, MAX_PHOTO_SIDE } from '../PhotoPixelsReader';

/** Un petit JPEG uni (rouge), encodé en base64 comme le renvoie saveAsync. */
function redJpegBase64(width: number, height: number): string {
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) rgba.set([220, 20, 20, 255], i * 4);
  const bytes = encode({ data: rgba, width, height }, 95).data;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return globalThis.btoa(binary);
}

describe('fitWithin', () => {
  it('réduit une photo de 12 Mpx à 640 px de côté en gardant les proportions', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: MAX_PHOTO_SIDE, height: 480 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 480, height: MAX_PHOTO_SIDE });
  });

  it('n’agrandit jamais une petite photo', () => {
    expect(fitWithin(320, 200)).toEqual({ width: 320, height: 200 });
  });
});

describe('base64ToBytes', () => {
  it('décode le base64 en octets', () => {
    expect(Array.from(base64ToBytes('AAEC/w=='))).toEqual([0, 1, 2, 255]);
  });
});

describe('ExpoPhotoPixelsReader', () => {
  beforeEach(() => mockManipulate.mockReset());

  it('réduit la photo en natif, puis la décode en pixels RGB', async () => {
    const resize = jest.fn();
    const original = { width: 4000, height: 3000 };
    mockManipulate
      .mockReturnValueOnce({ renderAsync: async () => original })
      .mockReturnValueOnce({
        resize,
        renderAsync: async () => ({ saveAsync: async () => ({ base64: redJpegBase64(64, 48) }) }),
      });

    const image = await new ExpoPhotoPixelsReader().read('file:///photo.jpg');

    expect(mockManipulate.mock.calls[0][1]).toEqual({ maxWidth: 2048, maxHeight: 2048 });
    expect(resize).toHaveBeenCalledWith({ width: 640, height: 480 });
    expect([image.width, image.height, image.data.length]).toEqual([64, 48, 64 * 48 * 3]);
    expect(image.data[0]).toBeGreaterThan(180); // rouge
    expect(image.data[1]).toBeLessThan(60);
  });

  it('ne redimensionne pas une photo déjà petite', async () => {
    const resize = jest.fn();
    mockManipulate
      .mockReturnValueOnce({ renderAsync: async () => ({ width: 300, height: 200 }) })
      .mockReturnValueOnce({ resize, renderAsync: async () => ({ saveAsync: async () => ({ base64: redJpegBase64(30, 20) }) }) });
    await new ExpoPhotoPixelsReader().read('file:///p.jpg');
    expect(resize).not.toHaveBeenCalled();
  });

  it('signale une photo illisible', async () => {
    mockManipulate
      .mockReturnValueOnce({ renderAsync: async () => ({ width: 300, height: 200 }) })
      .mockReturnValueOnce({ resize: jest.fn(), renderAsync: async () => ({ saveAsync: async () => ({}) }) });
    await expect(new ExpoPhotoPixelsReader().read('file:///p.jpg')).rejects.toThrow('Photo illisible');
  });
});
