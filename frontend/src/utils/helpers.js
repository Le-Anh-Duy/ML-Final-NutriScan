export const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const generatePlaceholderImage = (width = 300, height = 200) => {
    return `https://via.placeholder.com/${width}x${height}`;
};

export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};