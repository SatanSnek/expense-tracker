export default function ThemesView({ currentTheme, onThemeChange }) {
  const themes = [
    {
      id: 'default',
      name: 'Clean White',
      colors: 'bg-gray-50 border-gray-200',
      preview: 'bg-white'
    },
    {
      id: 'nebula',
      name: 'Nebula Gradient',
      colors: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
      preview: 'bg-indigo-900'
    },
    {
      id: 'cherry',
      name: 'Cherry Sunset',
      colors: 'bg-gradient-to-br from-pink-600 via-purple-600 to-yellow-400',
      preview: 'bg-pink-600'
    },
    // ✅ NEW THEME: Midnight Green
    {
      id: 'midnight',
      name: 'Midnight Green',
      colors: 'bg-gradient-to-br from-gray-900 via-green-900 to-black',
      preview: 'bg-green-900'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${currentTheme === 'default' ? 'text-gray-800' : 'text-white'}`}>
          App Themes
        </h2>
        <p className={`${currentTheme === 'default' ? 'text-gray-500' : 'text-gray-200'}`}>
          Customize the look and feel of your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`
              relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden
              ${currentTheme === theme.id 
                ? 'border-white ring-2 ring-white/20 scale-[1.02]' 
                : 'border-transparent hover:border-white/50 hover:scale-[1.01]'
              }
              ${currentTheme === 'default' ? 'bg-white' : 'bg-white/10 backdrop-blur-md'}
            `}
          >
            {/* Theme Preview Gradient */}
            <div className={`h-24 rounded-xl mb-4 ${theme.colors} shadow-inner`}></div>
            
            <div className="flex justify-between items-center">
              <span className={`font-bold ${currentTheme === 'default' ? 'text-gray-800' : 'text-white'}`}>
                {theme.name}
              </span>
              {currentTheme === theme.id && (
                <span className="bg-white text-gray-800 text-xs px-2 py-1 rounded-full font-bold">Active</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}