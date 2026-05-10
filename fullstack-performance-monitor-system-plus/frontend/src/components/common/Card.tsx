import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-card-bg dark:bg-dark-card-bg shadow-sm rounded-lg p-6 border border-gray-100 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
```

```