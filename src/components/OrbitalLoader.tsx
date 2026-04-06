interface OrbitalLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizes = {
  sm: { container: "w-24 h-24", r1: "w-14 h-14", r2: "w-16 h-16", r3: "w-20 h-20", text: "text-[10px]" },
  md: { container: "w-40 h-40", r1: "w-24 h-24", r2: "w-28 h-28", r3: "w-32 h-32", text: "text-xs" },
  lg: { container: "w-52 h-52", r1: "w-[120px] h-[120px]", r2: "w-[140px] h-[140px]", r3: "w-[160px] h-[160px]", text: "text-sm" },
};

const OrbitalLoader = ({ text = "Loading...", size = "md", fullScreen = false }: OrbitalLoaderProps) => {
  const s = sizes[size];
  const loader = (
    <div className={`relative ${s.container} flex items-center justify-center`}>
      <div className={`absolute ${s.r1} rounded-full border-2 border-transparent border-t-[3px] border-t-primary`}
        style={{ animation: "orbital-rotate1 2s linear infinite" }} />
      <div className={`absolute ${s.r2} rounded-full border-2 border-transparent border-b-[3px] border-b-[#ff00ff]`}
        style={{ animation: "orbital-rotate2 2s linear infinite" }} />
      <div className={`absolute ${s.r3} rounded-full border-2 border-transparent border-r-[3px] border-r-blue-accent`}
        style={{ animation: "orbital-rotate3 2s linear infinite" }} />
      <span className={`text-foreground ${s.text} tracking-widest`}
        style={{ animation: "pulse-text 1.5s ease-in-out infinite" }}>{text}</span>
    </div>
  );
  if (fullScreen) {
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">{loader}</div>;
  }
  return <div className="flex items-center justify-center py-12">{loader}</div>;
};

export default OrbitalLoader;
