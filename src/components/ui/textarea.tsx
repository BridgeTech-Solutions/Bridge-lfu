'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // Assurez-vous d'avoir un fichier `utils.ts` avec la fonction `cn`

/**
 * Composant Textarea stylisé pour s'intégrer à l'interface utilisateur de shadcn/ui.
 * Il est conçu pour être un remplacement direct de l'élément HTML natif `<textarea>`,
 * avec des styles par défaut pour le thème et l'état (`focus`, `disabled`).
 *
 * @component
 * @param {object} props - Les propriétés passées au composant.
 * @param {string} [props.className] - Classes CSS optionnelles pour personnaliser l'apparence.
 * @param {React.Ref<HTMLTextAreaElement>} ref - Référence au composant.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;
