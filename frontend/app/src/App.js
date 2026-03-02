import { useState } from "react";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";

function App() {
  const [selectedProperty, setSelectedProperty] = useState(null);

  return selectedProperty ? (
    <PropertyDetail
      property={selectedProperty}
      onBack={() => setSelectedProperty(null)}
    />
  ) : (
    <Properties onSelect={setSelectedProperty} />
  );
}

export default App;