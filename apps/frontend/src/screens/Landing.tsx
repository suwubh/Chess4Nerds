import { PlayCard } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { useThemeContext } from '@/hooks/useThemes';
import { THEMES_DATA } from '@/constants/themes';

// Import local images from src/components/images/
import questionsImg from '@/components/images/questions.png';
import githubIcon from '@/components/images/github-icon.svg';

export const Landing = () => {
  const { theme } = useThemeContext();
  const currentTheme = THEMES_DATA.find(data => data.name === theme);
  
  return (
    <>
      <div className="max-w-full mt-0">
        <div className="flex flex-col md:flex-row w-full gap-x-16">
          {
            currentTheme ? (
              <img
                className="rounded-md w-[700px] h-[600px] hidden md:block"
                src="/chessboardcover.png"
                alt="chess-board"
              />
            ) : (
              <img
                className="rounded-md w-[700px] h-[600px] hidden md:block"
                src="/chessboardcover.png"
                alt="chess-board"
              />
            )}
          <PlayCard />
        </div>
      </div>
      <div className="mt-32 bg-bgAuxiliary2 text-textMain w-full px-14 py-14 rounded-[36px]">
        <div className="lg:grid grid-cols-[45%,1fr] gap-28">
            <div className="rounded-xl">
                <img 
                  src={questionsImg}
                  alt="questions illustration" 
                />
            </div>
            <div className="mt-16 lg:mt-0">
                <h1 className="text-6xl font-bold text-left mt-[-10px]">Loved it or report a bug?</h1>
                <p className="text-xl mt-6">Visit my github to give a star or create an issue</p>
                <a 
                    href="https://github.com/suwubh/Chess4Nerds"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-10 rounded-2xl px-4 py-4 border border-slate-400 bg-transparent w-full text-2xl flex gap-10 items-center justify-center"  
                    >
                    <img 
                      className="w-16 h-16" 
                      src={githubIcon}
                      alt="GitHub icon"
                    />
                    <p className="text-4xl">Github</p>
                </a>
            </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
