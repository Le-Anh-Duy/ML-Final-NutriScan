import React from 'react';

const Card = ({ image, name, calories, tags = [], onYum, onNah }) => {
    return (
        <div className="bg-white shadow-md rounded-lg p-4">
            <img src={image} alt={name} className="w-full h-48 object-cover rounded-t-lg" />
            <h2 className="text-xl font-semibold mt-2">{name}</h2>
            <p className="text-gray-600">{calories} calories</p>
            <div className="flex flex-wrap mt-2">
                {tags && tags.length > 0 && tags.map((tag, index) => (
                    <span key={index} className="bg-blue-200 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                        {tag}
                    </span>
                ))}
            </div>
            <div className="flex justify-between mt-4">
                <button onClick={onYum} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Yum
                </button>
                <button onClick={onNah} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Nah
                </button>
            </div>
        </div>
    );
};

export default Card;