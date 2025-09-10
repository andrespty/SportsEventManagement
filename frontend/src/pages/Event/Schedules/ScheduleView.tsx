import React from 'react';
import { Box } from '@chakra-ui/react';
import CategoryView from './CategoryView';
type ViewType = 'list' | 'calendar' | 'timeline';

interface ScheduleViewProps {
    // Add any props you need
    view: ViewType;
    event: EventModel;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({view, event}) => {

    const containerProps = {
        bg: "white",
        borderRadius: "md",
        boxShadow: "sm",
        borderWidth: "1px"
    };

    const renderView = () => {
        switch (view) {
            case 'list':
                return <>
                    {event?.categories?.map((category) => (
                        <Box
                            key={category.id}
                            p={4}
                            mb={4}
                            {...containerProps}
                        >
                            <CategoryView category={category} />
                        </Box>
                    ))}
                </>;
            case 'calendar':
                return <Box p={4}>Calendar View</Box>; // Replace with your Calendar component
            case 'timeline':
                return <Box p={4}>Timeline View</Box>; // Replace with your Timeline component
            default:
                return <Box p={4}>List View</Box>;
        }
    };

    return (
        <Box>
            {renderView()}
        </Box>
    );
};

export default ScheduleView;
