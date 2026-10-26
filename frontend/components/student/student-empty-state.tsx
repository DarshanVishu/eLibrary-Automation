import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  /** Defaults to 'default' */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  icon?: IconName;
}

export interface EmptyStateProps {
  /** Material Symbols icon name */
  icon: IconName;
  title: string;
  description: string;
  /** Primary CTA */
  action?: EmptyStateAction;
  /** Optional secondary CTA rendered below the primary */
  secondaryAction?: EmptyStateAction;
}

/**
 * Shared empty / no-content state card used across Library, Recent, and
 * Bookmarks pages. Pass props to customise icon, copy, and actions.
 */
export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="bg-primary/10 mb-4 flex w-fit rounded-full p-4">
          <Icon name={icon} size="2xl" className="text-primary" />
        </div>
        <h2 className="mb-1 text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mb-5 max-w-xs text-sm">{description}</p>
        {action && (
          <div className="flex flex-col items-center gap-2">
            <Button variant={action.variant ?? 'default'} onClick={action.onClick}>
              {action.icon && <Icon name={action.icon} size="sm" className="mr-1.5" />}
              {action.label}
            </Button>
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant ?? 'ghost'}
                size="sm"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.icon && (
                  <Icon name={secondaryAction.icon} size="sm" className="mr-1.5" />
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
