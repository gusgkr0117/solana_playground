import React, { FC, useState, useEffect } from "react";

function NFTState({url}) {
    let [imageUrl, SetImageUrl] = useState("");
    let [imageName, SetImageName] = useState("");

    useEffect(() => {
        fetch(url).then((res) => res.json()).then((data) => {
            SetImageUrl(data.image);
            SetImageName(data.name);
        }).catch(() => {});
    });

    return (
        <div className="flex flex-col m-4">
            <h1>{imageName}</h1>
            <img src={imageUrl}></img>
        </div>
    );
}

export default NFTState;