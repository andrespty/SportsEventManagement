import React, { useState, useEffect} from 'react'
import { Box, Text } from '@chakra-ui/react'
import { CreateClub } from '../../features/CreateClub'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ManagerBoard() {

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {

        try {
                const result = await apiFetch<ApiResponse<User[]>>("/api/auth/", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                if (result.success){
                    console.log(result.data)
                    setUsers(result.data)
                }
                else {
                    setError(result.error.message)
                }
            } 
        catch{
                console.log("ERROR")
            }
        finally {
            setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <Text>Loading users...</Text>;
    if (error) return <Text color="red.500">{error}</Text>;

    return (
        <Box>
            <Text>
                Manager creates new clubs.    
            </Text>
            <Text>
                Must have access to all users
            </Text>
            <CreateClub users={users}/>
        </Box>
    )
}
