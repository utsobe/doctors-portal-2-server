const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndcheag.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            // step 1: get all services

            const services = await servicesCollection.find().toArray();

            // get the booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            // for each service, find bookings for that service
            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const bookingSlots = serviceBookings.map(book => book.slot);
                const available = service.slots.filter(slot => !bookingSlots.includes(slot));
                service.slots = available;
            });


            res.send(services);
        });

        /**
         * API Naming Convention
         * app.get('/booking')
         * app.get('/booking/:id')
         * app.post('/booking')
         * app.patch('/booking/:id')
         * app.delete('/booking/:id')
         */

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        });



    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Doctor Uncle');
});

app.listen(port, () => {
    console.log(`Doctors App Listening from on port ${port}`);
})