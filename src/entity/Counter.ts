import { Entity, ObjectIdColumn, Column, Index } from "typeorm";
import { ObjectId } from "mongodb";

@Entity("counters")
export class Counter {
  @ObjectIdColumn()
    _id!: ObjectId;

  @Column()
  @Index({ unique: true })
    name!: string;

  @Column({ default: 0 })
    seq!: number;
}
