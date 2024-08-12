export const titleOriginalWorkTypeList = async (key = null) => {
  const listArr = {
    game: "Game",
    advertisement: "Advertisement",
    graphic_novel: "Graphic Novel",
    non_fiction: "Non-fiction",
    fairy_tales: "Fairy Tales",
    drama: "Drama",
    cartoons: "Cartoons",
    musical: "Musical",
    broadcast: "Broadcast",
    epic_poetry: "Epic Poetry",
    tale: "Tale",
    novel: "Novel",
    animation: "Animation",
    essay: "Essay",
    play: "Play",
    movie: "Movie",
    webtoon: "Webtoon",
    autobiography: "Autobiography",
    web_novel: "Web novel",
  };

  if (key) {
    let retStr = "";
    if (listArr[key]) {
      retStr = listArr[key];
    }
    return retStr;
  } else {
    return listArr;
  }
};
