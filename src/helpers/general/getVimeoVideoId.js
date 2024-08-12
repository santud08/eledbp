export const getVimeoVideoId = async (url) => {
  // Regular expression to match the video ID
  const regex = /vimeo\.com\/(\d+)/i;
  const match = url.match(regex);

  // Check if there is a match
  if (match && match[1]) {
    return match[1];
  } else {
    // No match found
    return null;
  }
};
