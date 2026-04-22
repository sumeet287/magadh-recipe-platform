import { stringifyJsonLd } from "@/lib/schema";

interface Props {
  data: unknown | unknown[] | null | undefined;
  id?: string;
}

/**
 * Renders one or more JSON-LD blocks safely. Nulls/falsy entries are skipped
 * so callers can pass `faqSchema(items)` (which may be null) directly.
 */
export function JsonLd({ data, id }: Props) {
  if (!data) return null;
  const list = Array.isArray(data) ? data.filter(Boolean) : [data];
  if (list.length === 0) return null;
  return (
    <>
      {list.map((entry, i) => (
        <script
          key={id ? `${id}-${i}` : i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(entry) }}
        />
      ))}
    </>
  );
}
