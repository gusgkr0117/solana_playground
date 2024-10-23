import React, { FC, useState, useEffect, useContext } from "react";
import { GetProgramConfig, LOTTO_NUMBER_LIMIT } from "../config";
import { TrashBin } from "flowbite-react-icons/outline";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { UserContext } from "./AccountState";

enum LotteryState {
    Wait,
    Requested,
    Finished,
}

enum LotteryResult {
    NotMatched,
    Matched,
    Waiting,
    Outdated,
}

function RenderState(state) {
    switch(state) {
        case LotteryResult.NotMatched :
            return "not matched";
        case LotteryResult.Matched :
            return "matched";
        case LotteryResult.Waiting :
            return "waiting..";
        case LotteryResult.Outdated :
            return "outdated";
        default:
            return;
    }
}

function NFTState({item}) {
    let [imageUrl, SetImageUrl] = useState("");
    let [imageName, SetImageName] = useState("");
    let [lotteryResult, SetLotteryResult] = useState<LotteryResult | null>(null);
    let [answer, SetAnswer] = useState<number[] | null>(null);
    let [prevRound, SetPrevRound] = useState<number | null>(null);
    let { DeleteTicket } = useContext(UserContext);

    useEffect(() => {
        fetch(item.uri).then((res) => res.json()).then((data) => {
            SetImageUrl(data.image);
            SetImageName(data.name);
        }).catch(() => {});

        GetProgramConfig().then((programConfig) => {
            SetAnswer(programConfig.numbers.slice(0, 6).map((v) => v % LOTTO_NUMBER_LIMIT));
            SetPrevRound(programConfig.round - 1);

            console.log(item, programConfig.round, programConfig.numbers.slice(0, 6).map((v) => v % LOTTO_NUMBER_LIMIT));
            // if (prevRound.toString() == item.round) {
            //     if (answer.join(',') == item.numbers && item.state == LotteryState.Finished)
            //         SetLotteryResult(LotteryResult.Matched);
            //     else {
            //         SetLotteryResult(LotteryResult.NotMatched);
            //     }
            // } else if (prevRound > Number(item.round)) {
            //     SetLotteryResult(LotteryResult.Outdated);
            // } else {
            //     SetLotteryResult(LotteryResult.Waiting);
            // }
        });
    }, []);

    
    return (
        <div className="flex flex-col m-4 w-fit">
            <div className="relative">
                <button onClick={() => DeleteTicket(item.address)} className="absolute z-10 bg-transparent">
                    <TrashBin className="hover:text-violet-600" />
                </button>
                <div className="absolute flex flex-row z-10 space-x-1 text-center transform -translate-x-1/2 -translate-y-1/2 bottom-1 left-1/2">
                    {
                        item.numbers.map((x) => 
                            <div className={`${(prevRound == item.round && answer?.includes(Number(x)))? "animate-bounce" : ""} relative group`}>
                                <div className={`rounded-full bg-yellow-500 h-8 w-8 text-xs text-center group-hover:bg-yellow-600 group-active:bg-violet-700`}/>
                                <label className={`absolute select-none text-blue-900 transform -translate-x-1/2 translate-y-1/2 bottom-1/2 left-1/2`}>
                                    {x}
                                </label>
                            </div>
                        )
                    }
                </div>
                <img className="rounded drop-shadow-2xl" src={imageUrl}></img>
            </div>
            <p>{RenderState(lotteryResult)}</p>
        </div>
    );
}

export default NFTState;