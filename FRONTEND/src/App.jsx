import WalletButton from "./components/WalletButton";
import Home from "./pages/Home";

function App() {
  return (
    <div className="App">
      <header className="p-4 shadow-md">
        <WalletButton />
      </header>
      <Home />
    </div>
  );
}

export default App;
