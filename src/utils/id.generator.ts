import { AppDataSource } from "../data-source";
import { Counter } from "../entity/Counter";

export async function generateAdminUserId(): Promise<string> {
  try {
    const counterRepo = AppDataSource.getMongoRepository(Counter);

    const result = await counterRepo.findOneAndUpdate(
      { name: "admin_user_id" },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        returnDocument: "after" as any
      }
    );

    // MongoDB Node Driver 6.x findOneAndUpdate returns the document directly or a CommandResult
    const doc: any = (result as any).value || result;

    if (!doc || !doc.seq) {
      // Fallback if upsert did not return a value on first write
      const record = await counterRepo.findOneBy({ name: "admin_user_id" });
      const seqNum = record?.seq || 1;
      return `US${seqNum.toString().padStart(3, "0")}`;
    }

    const seqNum = doc.seq;
    return `US${seqNum.toString().padStart(3, "0")}`;
  } catch (err) {
    console.error("❌ Failed to generate atomic user ID:", err);
    throw err;
  }
}
