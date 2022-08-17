import request from "supertest";
import { app } from '../../app';
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";
import mongoose from 'mongoose';

test('should verify the id parameter', async () => {
    const user = global.signin();
    const id = '42342';

    await request(app)
        .patch(`/api/orders/${id}`)
        .set('Cookie', user)
        .send()
        .expect(400);
});

test('should not be able to cancel inexistent order', async () => {
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const user = global.signin();

    //  build order with the ticket
    let{body: builtOrder} = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    const id = new mongoose.Types.ObjectId();

    await request(app)
        .patch(`/api/orders/${id}`)
        .set('Cookie', user)
        .send()
        .expect(404);
        
    builtOrder = await Order.findById(builtOrder.id);
    expect(builtOrder.status).not.toEqual(OrderStatus.Cancelled);
});

test("should not allow a user to cancel another user's order", async () => { 
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const userOne = global.signin();
    const userTwo = global.signin();

    // build order with the ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', userOne)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    // make user to delete the order
    await request(app)
        .patch(`/api/orders/${order.id}`)
        .set('Cookie', userTwo)
        .send()
        .expect(401);
});

test('should allow an user to cancel an order', async () => {
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const user = global.signin();

    // request to create an order
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    // make a request to cancel the order
    await request(app)
        .patch(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send()
        .expect(204);

    // expectations
    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

test.todo('should emit an event for order:cancelled');