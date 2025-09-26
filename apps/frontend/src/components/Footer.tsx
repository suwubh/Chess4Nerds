import {
  GitHubLogoIcon,
  LinkedInLogoIcon
} from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="mt-40 py-16 text-gray-400">
      <div className="w-[96%] max-w-screen-lg mx-auto flex flex-col items-center justify-center">
        <div>
          <Link to={"/"}>Home</Link> |
          <Link to={"/settings"}> Settings</Link> |
          <Link to={"/login"}> Login</Link> |
          <Link to={"/game/random"}> Play</Link>
        </div>
        <div>
          <div className="flex gap-3 mt-4">
            <a href="https://github.com/suwubh" target="_blank">
              <GitHubLogoIcon />
            </a>
            <a href="https://www.linkedin.com/in/subhankar-satpathy" target="_blank">
              <LinkedInLogoIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
