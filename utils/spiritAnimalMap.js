// backend/utils/spiritAnimalMap.js

const avatarMap = {
  INTJ: {
    erkek: { img: "/images/animals/lion_male.png", label: "Aslan" },
    kadın: { img: "/images/animals/lion_female.png", label: "Aslan" }
  },
  ENTP: {
    erkek: { img: "/images/animals/monkey_male.png", label: "Maymun" },
    kadın: { img: "/images/animals/monkey_female.png", label: "Maymun" }
  },
  INFJ: {
    erkek: { img: "/images/animals/owl_male.png", label: "Baykuş" },
    kadın: { img: "/images/animals/owl_female.png", label: "Baykuş" }
  },
  ISTP: {
    erkek: { img: "/images/animals/wolf_male.png", label: "Kurt" },
    kadın: { img: "/images/animals/wolf_female.png", label: "Kurt" }
  },
  ENFP: {
    erkek: { img: "/images/animals/dolphin_male.png", label: "Yunus" },
    kadın: { img: "/images/animals/dolphin_female.png", label: "Yunus" }
  },
  ISFP: {
    erkek: { img: "/images/animals/cat_male.png", label: "Kedi" },
    kadın: { img: "/images/animals/cat_female.png", label: "Kedi" }
  },
  ESTJ: {
    erkek: { img: "/images/animals/eagle_male.png", label: "Kartal" },
    kadın: { img: "/images/animals/eagle_female.png", label: "Kartal" }
  },
  INFP: {
    erkek: { img: "/images/animals/panda_male.png", label: "Panda" },
    kadın: { img: "/images/animals/panda_female.png", label: "Panda" }
  },
  EFJS: {
    erkek: { img: "/images/animals/dolphin_male.png", label: "Yunus" },
    kadın: { img: "/images/animals/dolphin_female.png", label: "Yunus" }
  },
  ETPD: {
    erkek: { img: "/images/animals/lion_male.png", label: "Aslan" },
    kadın: { img: "/images/animals/lion_female.png", label: "Aslan" }
  },
  ESTP: {
    erkek: { img: "/images/animals/lion_male.png", label: "Aslan" },
    kadın: { img: "/images/animals/lion_female.png", label: "Aslan" }
  },
  ESFP: {
    erkek: { img: "/images/animals/lion_male.png", label: "Aslan" },
    kadın: { img: "/images/animals/lion_female.png", label: "Aslan" }
  }
};

function getSpiritAnimal(personalityCode, gender) {
  const normGender = (gender || "").toLowerCase();
  const genderKey = normGender === "kadın" || normGender === "female" ? "kadın" : "erkek";

  const fallback = avatarMap["INFJ"]?.erkek || {
    img: "/images/animals/default.png",
    label: "Bilinmiyor"
  };

  return avatarMap[personalityCode]?.[genderKey] || fallback;
}

module.exports = { getSpiritAnimal };
