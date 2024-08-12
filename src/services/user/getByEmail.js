import model from "../../models/index.js";
import { Sequelize } from "sequelize";

export const getByEmail = async (email) => {
  const result = await model.user.findOne({
    where: { email: email, status: "active" },
    raw: true,
    attributes: {
      include: [
        [
          Sequelize.fn("CONCAT", Sequelize.col("first_name"), " ", Sequelize.col("last_name")),
          "name",
        ],
      ],
    },
  });
  return result;
};
