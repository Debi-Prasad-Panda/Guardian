export default function Home() {
  return (
    <div className="home-container">
      <div className="hero section flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-h1 mb-4">Predict delays before they happen.</h1>
        <p className="subtitle text-secondary mb-8">AI early warning for logistics — 48-72 hours ahead.</p>
        <div className="flex gap-4 items-center justify-center">
          <button className="btn btn-primary">Get Started</button>
          <button className="btn btn-outline">Watch Demo</button>
        </div>
      </div>
    </div>
  );
}
