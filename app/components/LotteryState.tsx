import React, { useEffect, useState } from "react";
import { GetProgramConfig, LOTTO_NUMBER_LIMIT } from "../config";

function LotteryState() {
    let [round, SetRound] = useState<number>(0);
    let [numbers, SetNumbers] = useState<number[]>([]);
    
    useEffect(() => {
        GetProgramConfig().then((config) => {
            SetRound(config.round);
            SetNumbers(config.numbers.slice(0, 6).map(v => v % LOTTO_NUMBER_LIMIT));
        });
    }, []);
    
    return (
        <div className="flex flex-col items-center w-fit rounded-lg border p-2">
            <h1>Previous {round}-th Round</h1>
            <div className="flex flex-row space-x-1">
            {
                numbers.sort((a,b) => a-b).map((x) => 
                    <div className="relative">
                        <div className={`rounded-full bg-yellow-300 h-10 w-10 text-xs text-center`}/>
                        <label className="absolute text-blue-900 select-none transform -translate-x-1/2 translate-y-1/2 bottom-1/2 left-1/2">
                            {(x).toString()}
                        </label>
                    </div>
                )
            }
            </div>
            <h1>Rewards : 10000 SOL</h1>
        </div>
    );
}

export default LotteryState;