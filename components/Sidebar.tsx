import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <nav>
        <ul>
          <li className="mb-4">
            <Link href="/dashboard?tab=dashboard">Dashboard</Link>
          </li>
          <li className="mb-4">
            <Link href="dashboard?tab=collector">Collectors</Link>
          </li>
          <li className="mb-4">
            <Link href="/dashboard?tab=bins">Bins</Link>
          </li>
          <li className="mb-4">
            <Link href="/dashboard?tab=map">Areas</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}