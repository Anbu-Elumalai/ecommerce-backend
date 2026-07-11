import { AppDataSource } from "../data-source";
import { Tax } from "../entity/Tax";

export class TaxService {
  private taxRepo = AppDataSource.getMongoRepository(Tax);

  async list() {
    const taxes = await this.taxRepo.find({
      where: { isDeleted: false, isActive: true } as any,
      order: { value: "ASC" }
    });

    return taxes;
  }
}
