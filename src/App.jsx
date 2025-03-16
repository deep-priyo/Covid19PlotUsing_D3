import React from 'react'
import CovidGraph from "./Components/CovidGraph.jsx";

const App = () => {
    return (
        <div className="w-full min-h-screen  flex items-center justify-center p-4 relative overflow-hidden">
            <div
                className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div
                    className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
            </div>

            <div className="w-[90%] max-w-5xl relative z-10">
                <CovidGraph/>
            </div>
        </div>
    );
}

export default App