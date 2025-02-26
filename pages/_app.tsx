import { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';
import '../styles/global.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;