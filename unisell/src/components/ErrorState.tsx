import { useTheme } from '../theme';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  message?: string | null;
  onRetry: () => void;
}

/**
 * Shared error state for failed listing requests.
 * Network failures normally use the bundled fallback, so this appears for
 * unexpected server errors (for example, json-server returning a 500).
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <EmptyState
      icon="alert-circle-outline"
      accent={colors.danger}
      title="Could not load listings"
      message={message ?? 'Please check the mock server and try again.'}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}
