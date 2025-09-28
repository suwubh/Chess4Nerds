import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useRecoilState } from 'recoil';
import { userAtom } from '../../../../packages/store/src/atoms/user';
import { useThemeContext } from '@/hooks/useThemes'; // Adjust import according to your project structure

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();
  const guestName = useRef<HTMLInputElement>(null);
  const [_, setUser] = useRecoilState(userAtom);
  const { theme } = useThemeContext();

  const google = () => {
    window.open(`${BACKEND_URL}/auth/google`, '_self');
  };

  const github = () => {
    window.open(`${BACKEND_URL}/auth/github`, '_self');
  };

  const loginAsGuest = async () => {
    const response = await fetch(`${BACKEND_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: (guestName.current && guestName.current.value) || '',
      }),
    });
    const user = await response.json();
    setUser(user);
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-textMain">
      <h1
        className={`text-4xl font-bold mb-8 text-center drop-shadow-lg ${
          theme === 'pink' ? 'text-pink-300' : 'text-[#9A9484]'
        }`}
      >
        Enter the Game World
      </h1>
      <div className="bg-bgAuxiliary2 rounded-lg shadow-lg p-8 flex flex-col md:flex-row">
        <div className="mb-8 md:mb-0 md:mr-8 justify-center flex flex-col">
          <div
            className="flex items-center justify-center px-4 py-2 rounded-md mb-4 cursor-pointer transition-colors hover:bg-gray-600 duration-300"
            onClick={google}
          >
            <img src="google.svg" alt="" className="w-6 h-6 mr-2" />
            Sign in with Google
          </div>
          <div
            className="flex items-center justify-center px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 transition-colors duration-300"
            onClick={github}
          >
            <img src="github.svg" alt="" className="w-6 h-6 mr-2" />
            Sign in with Github
          </div>
        </div>
        <div className="flex flex-col items-center md:ml-8">
          <div className="flex items-center mb-4">
            <div className="bg-gray-600 h-1 w-12 mr-2"></div>
            <span className="text-gray-400">OR</span>
            <div className="bg-gray-600 h-1 w-12 ml-2"></div>
          </div>
          <input
            type="text"
            ref={guestName}
            placeholder="Username"
            className="border px-4 py-2 rounded-md mb-4 w-full md:w-64 text-black"
          />
          <button
            className={`text-white px-4 py-2 rounded-md transition-colors duration-300 ${
              theme === 'pink'
                ? 'bg-pink-300 hover:bg-pink-400'
                : 'bg-[#9A9484] hover:bg-[#8B8570]'
            }`}
            onClick={() => loginAsGuest()}
          >
            Enter as guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
