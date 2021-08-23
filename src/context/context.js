import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({children}) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);
    
    const [request, setRequest] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({show:false, msg:''});

    const searchGithubUser = async (user) => {
        toggleError()
        setIsLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`)
        .catch((error) => console.log(error))
        
        if(response){
            setGithubUser(response.data)
            const {login, followers_url} = response.data;

            // repos 
            // axios(`${rootUrl}/users/${login}/repos?per_page=100`)
            // .then((response) => setRepos(response.data))
            // // followers
            // axios(`${followers_url}?per_page=100`)
            // .then((response) => setFollowers(response.data))

            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ]).then((results) => {
                const [repos, followers] = results;
                const status = 'fulfilled'
                if(repos.status === status ){
                    setRepos(repos.value.data);
                }
                if(followers.status === status ){
                    setFollowers(followers.value.data);
                }
            }).catch((error) => console.log(error))
            
        }else{
            toggleError( true, 'there is no user with that user name!' )
        }
        checkRequests();
        setIsLoading(false)
    }

    // check request
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
        .then(({data}) => {
            let { rate:{remaining} } = data;
            setRequest(remaining)
            if(remaining === 0){
                toggleError(true, 'sorry, you hve exceded your hourly rate limite!');
            }
        })
        .then((error) => console.log(error) )
    }

    function toggleError(show = false, msg = ''){
        setError({show, msg})
    }
    


    useEffect(checkRequests , []) 

    return(
        <GithubContext.Provider value={{
            githubUser,
            repos,
            followers,
            request,
            error,
            toggleError,
            searchGithubUser,
            isLoading
        }}
        >
            {children}
        </GithubContext.Provider>
    )
}

export const useGlobalContext = () => {
    return useContext(GithubContext);
}

export {GithubProvider, GithubContext}