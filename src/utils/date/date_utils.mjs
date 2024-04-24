import axios from 'axios';
import moment from 'moment';

export const getDateAndTime = async () => {
    try {
        const response = await axios.get('http://worldtimeapi.org/api/timezone/America/Mexico_City');
        const { date } = response.data;
        
        const formattedDate = moment(date).format('DD-MM-YYYY');
        const formattedTime = moment(date).format('h:mm A');
        
        return { fecha: formattedDate, hora: formattedTime };
    } catch (error) {
        console.error('Error at getDateAndTimeAPI');
        throw error;
    }
}