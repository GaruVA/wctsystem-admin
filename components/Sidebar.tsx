import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <nav>
        <ul>
          <li className="mb-4">
            <Link href="/dashboard?tab=stats">Stats</Link>
          </li>
          <li className="mb-4">
            <Link href="dashboard?tab=driver">Driver</Link>
          </li>
          <li className="mb-4">
            <Link href="/dashboard?tab=map">Map</Link>
          </li>
          <li className="mb-4">
            <Link href="/dashboard?tab=notifications">Notifications</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}