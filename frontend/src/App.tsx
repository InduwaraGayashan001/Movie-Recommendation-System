import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { 
  Container, 
  TextField, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardMedia,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Chip,
  Rating,
  Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MovieIcon from '@mui/icons-material/Movie'
import LocalMoviesIcon from '@mui/icons-material/LocalMovies'
import axios from 'axios'
import MovieDetails from './components/MovieDetails'
import Layout from './Layout'

interface Movie {
  movieId: number
  title: string
  genres: string
  poster_path: string | null
  tmdb_id: number | null
  overview: string | null
  vote_average: number | null
  vote_count: number | null
  release_date: string | null
  runtime: number | null
  director: string | null
  relevant_tags: string[] | null
}

interface Recommendation {
  score: number
  title: string
  genres: string
  poster_path: string | null
}

interface SearchResponse {
  movies: Movie[]
}

interface RecommendationResponse {
  recommendations: Recommendation[]
}

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4081', // Pink
    },
    secondary: {
      main: '#00e5ff', // Cyan
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
      background: 'linear-gradient(45deg, #ff4081 30%, #00e5ff 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter at least one character to search')
      return
    }

    setIsSearching(true)
    setError('')
    
    try {
      console.log('Searching for:', searchQuery)
      const response = await axios.get<SearchResponse>(`http://localhost:8000/api/search?query=${encodeURIComponent(searchQuery)}`)
      console.log('Search results:', response.data)
      setSearchResults(response.data.movies)
    } catch (err) {
      console.error('Search error:', err)
      setError('Error searching for movies. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`)
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            background: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleSearch}
                    color="primary"
                    disabled={isSearching}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 64, 129, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 64, 129, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }
            }}
          />
        </Paper>

        {isSearching ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : searchResults.length > 0 ? (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}>
            {searchResults.map((movie) => (
              <Card 
                key={movie.movieId}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: 'rgba(30, 30, 30, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(255, 64, 129, 0.3)'
                  }
                }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}
              >
                {movie.poster_path ? (
                  <CardMedia
                    component="img"
                    height="400"
                    image={movie.poster_path}
                    alt={movie.title}
                    sx={{ 
                      objectFit: 'contain',
                      bgcolor: 'black'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.900',
                      gap: 2
                    }}
                  >
                    <MovieIcon 
                      sx={{ 
                        fontSize: 100,
                        color: 'primary.main',
                        opacity: 0.7
                      }} 
                    />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {movie.title}
                  </Typography>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1
                    }}
                  >
                    {movie.genres}
                  </Typography>
                  {movie.vote_average && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating 
                        value={movie.vote_average / 2} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({movie.vote_count?.toLocaleString()} votes)
                      </Typography>
                    </Box>
                  )}
                  {movie.relevant_tags && movie.relevant_tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {movie.relevant_tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 64, 129, 0.1)',
                            color: 'primary.main',
                            border: '1px solid rgba(255, 64, 129, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 64, 129, 0.2)',
                            }
                          }}
                        />
                      ))}
                      {movie.relevant_tags.length > 3 && (
                        <Chip
                          label={`+${movie.relevant_tags.length - 3}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 64, 129, 0.1)',
                            color: 'primary.main',
                            border: '1px solid rgba(255, 64, 129, 0.2)',
                          }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2,
                background: 'linear-gradient(45deg, #FF4081 30%, #FF9100 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}
            >
              Welcome to CineMatch
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.8,
                letterSpacing: '0.02em',
                fontWeight: 400
              }}
            >
              Discover your next favorite movie with our movie recommendation system. 
              Simply search for a movie you love, and we'll find similar films you might enjoy.
            </Typography>
          </Box>
        )}
      </Container>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/movie/:movieId" element={<MovieDetails />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

