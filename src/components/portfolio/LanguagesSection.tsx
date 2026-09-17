const languages = [
  { name: "German", level: "Native" },
  { name: "English", level: "C2" },
  { name: "Spanish", level: "B1" },
  { name: "Russian", level: "A2" },
  { name: "Arabic", level: "A2" },
];

const LanguagesSection = () => {
  return (
    <section id="languages" className="py-10 px-5 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Languages</h2>
        <p className="text-foreground text-base sm:text-lg">
          {languages.map((l, i) => (
            <span key={l.name}>
              {l.name} {l.level}
              {i < languages.length - 1 ? <span className="text-muted-foreground"> · </span> : null}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

export default LanguagesSection;
