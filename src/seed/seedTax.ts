import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Tax } from "../entity/Tax";

const GST_RATES = [
  { name: "0% (Nil)", value: 0 },
  { name: "5% GST", value: 5 },
  { name: "12% GST", value: 12 },
  { name: "18% GST", value: 18 },
  { name: "28% GST", value: 28 }
];

export async function seedTax() {
  const taxRepo = AppDataSource.getMongoRepository(Tax);

  for (const rate of GST_RATES) {
    const exists = await taxRepo.findOne({
      where: { name: rate.name }
    });

    if (!exists) {
      const tax = taxRepo.create({
        name: rate.name,
        value: rate.value,
        isActive: true,
        isDeleted: false
      });
      await taxRepo.save(tax);
    }
  }

  console.log("✅ Tax rates seeded");
}
