import { TicketCreatedListener } from "../ticket-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketCreatedEvent } from "@frst-ticket-app/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming';
import { Ticket } from "../../../models/ticket";

const setup = async () => {  
    // create an instance of the Listener
    const listener = new TicketCreatedListener(natsWrapper.client);

    // create fake data event
    const data: TicketCreatedEvent['data'] ={
        version:0,
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 43,
        date: new Date(),
        location: 'sd',
        description: 'fff',
        userId: new mongoose.Types.ObjectId().toHexString(),
    };

    // create fake message object(dirty fix to not implement trivial props)
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, msg };
}
test('should creates and save a ticket', async () => {
    const { listener, data, msg} = await setup();

    // call the onMessage function with the data obj + message obj
    await listener.onMessage(data, msg);

    // assertion to make sure a ticket was created
    const ticket = await Ticket.findById(data.id);

    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
});

test('should ack the message', async () => {
    const { listener, data, msg} = await setup();

    // call the onMessage function with the data obj + message obj
    await listener.onMessage(data, msg);

    // write assertions to make sure function is called
    expect(msg.ack).toHaveBeenCalled();
});