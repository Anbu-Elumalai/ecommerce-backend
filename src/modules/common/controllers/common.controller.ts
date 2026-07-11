import {
  JsonController,
  Get,
  UseBefore
} from "routing-controllers";
import { TaxService } from "../../../services/tax.service";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";

@JsonController("/common")
@UseBefore(AuthMiddleware)
export class CommonController {
  private taxService = new TaxService();

  @Get("/taxes")
  async getTaxes() {
    const taxes = await this.taxService.list();
    return {
      success: true,
      message: "Taxes fetched successfully",
      data: taxes
    };
  }
}
