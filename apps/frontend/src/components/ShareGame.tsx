import { useState } from "react";
import { Button } from "./Button";
import { useThemeContext } from "@/hooks/useThemes"; // Import your theme context

export const ShareGame = ({ className, gameId }: { className?: string, gameId: string }) => {

    const { theme } = useThemeContext();
    const url = window.origin + "/game/" + gameId;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        window.navigator.clipboard.writeText(url);
        setCopied(() => true);
    };

    return (
        <div className={`flex flex-col items-center gap-y-4 ${className}`}>

            <h3 className={`scroll-m-20 text-4xl font-semibold tracking-tight 
                ${theme === "pink" ? "text-pink-400" : "text-[#9A9484]"}`}>
                Play with Friends
            </h3>

            <div className="flex items-center gap-x-2">
                <LinkSvg />

                <div onClick={handleCopy} className="text-blue-500 cursor-pointer">
                    {url}
                </div>
            </div>
            
            <Button onClick={handleCopy}>
                {copied ? `Copied to Clipboard !!` : `Copy the link`}
            </Button>
        </div>
    );
};

const LinkSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round"
         className="lucide lucide-link text-white">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);
