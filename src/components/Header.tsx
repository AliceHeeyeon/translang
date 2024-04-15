"use client"

interface HeaderProps {
  toggleColorMode: () => void;
  isColorMode: boolean; 
}

const Header: React.FC<HeaderProps> =({ toggleColorMode, isColorMode }) => {
  return (
    <div id="header">
      <h2>TRANSLANG</h2>
      <button 
      className="mode-toggle"
      onClick = {toggleColorMode}
    >
      <p>MODE</p>
      <div className="ball"></div>
    </button>
    </div>
  )
}

export default Header
