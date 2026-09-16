function MarkdownContent({ source }: { source: string }) {
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 font-sans text-base leading-relaxed text-brand-text-body sm:text-lg">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return <h3 key={index} className="pt-2 text-xl font-bold text-brand-navy">{block.slice(4)}</h3>;
        }

        if (block.startsWith("## ")) {
          return <h2 key={index} className="pt-3 text-2xl font-extrabold text-brand-navy">{block.slice(3)}</h2>;
        }

        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return <ul key={index} className="list-disc space-y-2 pl-6">{lines.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
        }

        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

export { MarkdownContent };
