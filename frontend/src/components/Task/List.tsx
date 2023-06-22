import BtnUpdate from './BtnUpdate';
import { BtnDelete, BtnDeleteAll } from './BtnDelete';
import { 
    HStack, 
    Box, 
    Stack,
    VStack, 
    Flex, 
    Text, 
    StackDivider,
    Button,
    Checkbox } from '@chakra-ui/react';
import { Image } from '@chakra-ui/react';
import img from '../../images/empty.svg';
import { ITab } from '../../interfaces/Tab';
import { IState, ITask, ITasks } from '../../interfaces/Task';
import FormAdd from './FormAdd';
import { useSelector, useDispatch } from "react-redux";
import { updateTab } from '../../slices/TabSlice';
import { toggleComplete } from '../../slices/TaskSlice';


function TaskList() {
    const dispatch = useDispatch();
    const tab = useSelector(
        (state : ITab) => state.tabWatch.tab
    );
    const tasks = useSelector(
        (state : IState) => state.tasksWatch.tasks
    );

    function filterTasks():ITasks {
        return tasks.filter(task => {
            switch (tab) {
                case 'progress':
                    return !task.complete;
                case 'completed':
                    return task.complete;
                default:
                    return task;
            }
        }).sort(task => task.complete ? 1 : -1);
    }

    const myTask = (task: ITask) => {
        const op:string = task.complete ? '0.2' : '1';
        const as:any = task.complete ? 'del' : '';

        return <HStack
            key={task.id}
            opacity={op}
            >
                <Checkbox colorScheme='green' 
                defaultChecked={task.complete} 
                onChange={() => dispatch(toggleComplete(task))}/>
                <Text
                    w='100%' 
                    p='8px'
                    as={as}
                    borderRadius='lg'>
                    {task.description}
                </Text>
                <BtnDelete task={task} />
                <BtnUpdate task={task} />
            </HStack>
    }

    if (!filterTasks().length) {
        return (
            <>
                <FormAdd />
                <Stack spacing={2} direction='row' align='center'>
                    <Button colorScheme='purple' size='xs'
                    onClick={() => dispatch(updateTab('progress'))}
                    isActive={tab === 'progress'}
                    variant='outline'>
                        in progress
                    </Button>
                    <Button colorScheme='green' size='xs'
                    onClick={() => dispatch(updateTab('completed'))}
                    isActive={tab === 'completed'}
                    variant='outline'>
                        Completed
                    </Button>
                    <Button colorScheme='blue' size='xs'
                    onClick={() => dispatch(updateTab('all'))}
                    isActive={tab === 'all'}
                    variant='outline'>
                        All
                    </Button>
                </Stack>
                <Box maxW='80%'>
                    <Image mt='20px' w='98%' maxW='350' src={img} 
                    alt='Sua lista está vazia :(' />
                </Box>
            </>
        );
    }
  return (
      <>
        <FormAdd />
        <Stack spacing={2} direction='row' align='center'>
            <Button colorScheme='purple' size='xs'
            onClick={() => dispatch(updateTab('progress'))}
            isActive={tab === 'progress'}
            variant='outline'>
                in progress
            </Button>
            <Button colorScheme='green' size='xs'
            onClick={() => dispatch(updateTab('completed'))}
            isActive={tab === 'completed'}
            variant='outline'>
                completed
            </Button>
            <Button colorScheme='blue' size='xs'
            onClick={() => dispatch(updateTab('all'))}
            isActive={tab === 'all'}
            variant='outline'>
                all
            </Button>
        </Stack>
        <VStack
            divider={<StackDivider />}
            borderColor='gray.100'
            borderWidth='2px'
            p='5'
            borderRadius='lg'
            w='100%'
            maxW={{ base: '90vw', sm: '80vw', lg: '50vw', xl: '30vw' }}
            alignItems='stretch'
            >
            
            {filterTasks().map(myTask)}    
        </VStack>

        <Flex>
            <BtnDeleteAll />
        </Flex>
    </>
  );
}

export default TaskList;