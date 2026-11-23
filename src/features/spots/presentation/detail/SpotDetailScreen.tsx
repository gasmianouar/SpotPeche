import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { CreatorCard } from './components/CreatorCard';
import { MessageBubble } from './components/MessageBubble';
import { MessageComposer } from './components/MessageComposer';
import { SpotItemsCard } from './components/SpotItemsCard';
import { useSpotDetailViewModel } from './useSpotDetailViewModel';

/** VUE de la fiche spot (écran 5 de la maquette). */
export function SpotDetailScreen({ spotId }: { spotId: string }) {
  const vm = useSpotDetailViewModel(spotId);
  const { uiState, composer } = vm;
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Après un envoi, on descend jusqu'au nouveau message.
  useEffect(() => {
    if (vm.sentCount > 0) scrollRef.current?.scrollToEnd({ animated: true });
  }, [vm.sentCount]);

  // La barre d'emoji du dernier message s'ouvre sous la bulle : on défile pour qu'elle soit visible.
  const messages = uiState.status === 'ready' ? uiState.detail.messages : [];
  const lastId = messages[messages.length - 1]?.message.id;
  useEffect(() => {
    if (vm.reactionsOpenFor && vm.reactionsOpenFor === lastId) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [vm.reactionsOpenFor, lastId]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour à la carte" onPress={vm.back} />
        <Text accessibilityRole="header" style={styles.title}>
          Fiche spot
        </Text>
        <IconButton
          icon="partly-sunny-outline"
          color={colors.primary}
          accessibilityLabel="Météo du spot"
          onPress={vm.openWeather}
        />
      </View>

      {uiState.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {(uiState.status === 'notFound' || uiState.status === 'error') && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.muted} />
          <Text accessibilityRole="alert" style={styles.message}>
            {uiState.status === 'notFound' ? 'Ce spot n’existe plus.' : uiState.message}
          </Text>
          {uiState.status === 'error' && (
            <Pressable accessibilityRole="button" onPress={vm.retry} style={styles.retry}>
              <Text style={styles.retryLabel}>Réessayer</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* behavior « padding » sur les deux plateformes : avec l'affichage bord à bord d'Android
          (Expo 58), l'écran ne rétrécit plus tout seul quand le clavier s'ouvre. */}
      {uiState.status === 'ready' && (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <CreatorCard
              spot={uiState.detail.spot}
              votes={uiState.detail.activityVotes}
              myVote={uiState.detail.myVote}
              onDirections={vm.openDirections}
              onShare={vm.share}
              onVote={vm.vote}
            />
            <SpotItemsCard species={uiState.detail.species} baits={uiState.detail.baits} onAdd={vm.addItems} />

            <View style={styles.messages}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Messages
              </Text>
              {uiState.detail.messages.length === 0 && (
                <Text style={styles.empty}>Aucun message. Lancez la discussion !</Text>
              )}
              {uiState.detail.messages.map((view) => (
                <MessageBubble
                  key={view.message.id}
                  view={view}
                  reactionsOpen={vm.reactionsOpenFor === view.message.id}
                  onToggleReactions={vm.toggleReactions}
                  onReact={vm.react}
                  onReply={vm.reply}
                />
              ))}
            </View>
          </ScrollView>

          <MessageComposer
            text={composer.text}
            photoUris={composer.photoUris}
            replyTo={composer.replyTo}
            isSending={composer.isSending}
            canSend={composer.canSend}
            canAddPhotos={composer.canAddPhotos}
            error={composer.error}
            onChangeText={vm.setText}
            onTakePhoto={vm.takePhoto}
            onPickPhotos={vm.pickPhotos}
            onRemovePhoto={vm.removePhoto}
            onCancelReply={vm.cancelReply}
            onSend={vm.send}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  flex: { flex: 1 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  message: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: spacing.xl, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center' },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  content: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  messages: { gap: 18, paddingTop: spacing.xs },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
