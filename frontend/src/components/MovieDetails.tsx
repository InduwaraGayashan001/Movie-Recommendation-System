import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
  Rating,
  Tooltip
} from '@mui/material'
import axios from 'axios'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import MovieIcon from '@mui/icons-material/Movie'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PeopleIcon from '@mui/icons-material/People'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LocalMoviesIcon from '@mui/icons-material/LocalMovies'

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
  relevant_tags?: string[]
}

interface Recommendation {
  score: number
  title: string
  genres: string
  poster_path: string | null
  imdb_id: string | null
  movieId: number
}

interface MovieDetails {
  movie: Movie
  recommendations: Recommendation[]
}

function MovieDetails() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true)
        setError('')
        setMovieDetails(null) // Reset movie details when fetching new data
        
        // Get movie details
        const movieResponse = await axios.get<Movie>(`http://localhost:8000/api/movie/${movieId}`)
        
        // Get recommendations
        const recommendationsResponse = await axios.get<{ recommendations: Recommendation[] }>(
          `http://localhost:8000/api/recommendations?movieId=${movieId}`
        )

        setMovieDetails({
          movie: movieResponse.data,
          recommendations: recommendationsResponse.data.recommendations
        })
      } catch (err) {
        console.error('Error fetching movie details:', err)
        setError('Error loading movie details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (movieId) {
      fetchMovieDetails()
    }
  }, [movieId]) // Re-run effect when movieId changes

  const handleMovieClick = (movieId: number) => {
    if (!movieId) {
      console.error('Invalid movie ID:', movieId)
      return
    }
    navigate(`/movie/${movieId}`)
  }

  const getRecommendationStars = (score: number) => {
    // Convert score to 1-5 scale
    const normalizedScore = (score / 100) * 5
    return Math.min(5, Math.max(1, Math.round(normalizedScore)))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Search
        </Button>
      </Container>
    )
  }

  if (!movieDetails) {
    return null
  }

  const { movie, recommendations } = movieDetails

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/images/image.png")',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
          opacity: 0.50,
          zIndex: 0,
        },
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 64, 129, 0.2)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalMoviesIcon 
                sx={{ 
                  fontSize: 40,
                  color: 'primary.main',
                  filter: 'drop-shadow(0 0 8px rgba(255, 64, 129, 0.5))'
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  background: 'linear-gradient(45deg, #FF4081 30%, #FF9100 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em'
                }}
              >
                CineMatch
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ 
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(255, 64, 129, 0.1)',
                }
              }}
              startIcon={<ArrowBackIcon />}
            >
              Back to Search
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1, mt: '80px' }}>
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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mt: 2
          }}>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 300px' },
              position: 'relative'
            }}>
              {movie.poster_path ? (
                <CardMedia
                  component="img"
                  image={movie.poster_path}
                  alt={movie.title}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 450,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.900',
                    borderRadius: 2,
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
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF4081 30%, #FF9100 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}>
                {movie.title}
              </Typography>

              {movie.overview && (
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    mb: 3
                  }}
                >
                  {movie.overview}
                </Typography>
              )}

              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 2,
                mb: 3
              }}>
                {movie.vote_average && (
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 64, 129, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    minWidth: 120,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 64, 129, 0.2)'
                  }}>
                    <Tooltip title="Rating" placement="top">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <EmojiEventsIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {movie.vote_average.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {movie.vote_count?.toLocaleString()} votes
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}

                {movie.release_date && (
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 64, 129, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    minWidth: 120,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 64, 129, 0.2)'
                  }}>
                    <Tooltip title="Release Date" placement="top">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {new Date(movie.release_date).getFullYear()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(movie.release_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}

                {movie.runtime && (
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 64, 129, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    minWidth: 120,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 64, 129, 0.2)'
                  }}>
                    <Tooltip title="Runtime" placement="top">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {movie.runtime}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          minutes
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {movie.relevant_tags && movie.relevant_tags.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {movie.relevant_tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
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
                  </Box>
                </Box>
              )}

              {movie.director && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
                    Director
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'primary.main' }}>
                    {movie.director}
                  </Typography>
                </Box>
              )}

              <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
                Genres
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {movie.genres.split('|').map((genre, index) => (
                  <Chip
                    key={index}
                    label={genre}
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
              </Box>
            </Box>
          </Box>
        </Paper>

        <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'white' }}>
          Recommended Movies
        </Typography>
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
          {recommendations.map((movie, index) => (
            <Card 
              key={movie.movieId || index}
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
              onClick={() => movie.movieId && handleMovieClick(movie.movieId)}
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
                    overflow: 'hidden'
                  }}
                >
                  {movie.genres}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      sx={{
                        color: i < getRecommendationStars(movie.score) ? 'warning.main' : 'grey.700',
                        fontSize: '1.2rem'
                      }}
                    />
                  ))}
                  <Typography 
                    variant="body2" 
                    color="warning.main"
                    sx={{ 
                      ml: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {getRecommendationStars(movie.score) >= 4 ? 'Top Pick' : 
                     getRecommendationStars(movie.score) >= 3 ? 'Great Match' : 
                     'Good Match'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  )
}

export default MovieDetails 
