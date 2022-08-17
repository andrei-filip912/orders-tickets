import mongoose from 'mongoose';
import { Order, OrderStatus } from './order';

// it is a bad practice to include this file in the common module since the
// definition of a ticket is specific to each service (this service does not
// need the other properties of a ticket)

interface TicketAttributes {
    title: string;
    price: number;
}

interface TicketDocument extends mongoose.Document {
    title: string;
    price: number;
    isReserved() : Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDocument> {
    build(attributes: TicketAttributes): TicketDocument;
}

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

ticketSchema.statics.build = (attributes: TicketAttributes) => {
    return new Ticket(attributes);
}
// critical to use function keyword so this keyword will work properly
ticketSchema.methods.isReserved = async function() {
    const existingOrder = await Order.findOne({
        ticket: this, // this refers to the current ticket
        status: {
            $in: [
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete
            ]
        }
    });
    
    if(existingOrder) {
        return true;
    }
    return false;
}

const Ticket = mongoose.model<TicketDocument, TicketModel>('Ticket', ticketSchema);

export { Ticket, TicketDocument };