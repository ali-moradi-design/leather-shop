import { Schema, model, Document, Types, Query } from 'mongoose';

export interface IAddressDoc {
  _id: Types.ObjectId;
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUserDoc extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  guest: boolean;
  addresses: IAddressDoc[];
  roles: Types.ObjectId[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // empty for guest accounts until they set a password from the emailed link
    passwordHash: { type: String, select: false },
    guest: { type: Boolean, default: false },
    addresses: {
      type: [
        new Schema<IAddressDoc>({
          label: { type: String, trim: true, maxlength: 40 },
          fullName: { type: String, required: true, trim: true },
          line1: { type: String, required: true, trim: true },
          line2: { type: String, trim: true },
          city: { type: String, required: true, trim: true },
          state: { type: String, trim: true },
          postalCode: { type: String, required: true, trim: true },
          country: { type: String, required: true, trim: true },
          isDefault: { type: Boolean, default: false },
        }),
      ],
      default: [],
      validate: [(v: unknown[]) => v.length <= 10, 'At most 10 saved addresses'],
    },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre(/^find/, function (this: Query<unknown, IUserDoc>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const UserModel = model<IUserDoc>('User', userSchema);
