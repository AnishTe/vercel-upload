// pages/[...not_found].tsx or app/[...not_found]/page.tsx
import { FC } from "react";

const NotFoundCatchAll: FC = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
    </div>
  );
};

// Use `generateStaticParams` to allow Next.js to statically generate the page
export function generateStaticParams() {
  return [
    {
      not_found: ["*"], // This will ensure that all catch-all params are handled as static
    },
  ];
}

export default NotFoundCatchAll;
