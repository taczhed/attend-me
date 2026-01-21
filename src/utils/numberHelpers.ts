export function parseAlbumId(input: string): number | null {
  const trimmedInput = input.trim()
  const albumId = Number(trimmedInput)

  if (isNaN(albumId)) {
    return null
  }

  return albumId
}

export function isValidAlbumId(albumId: number | null): boolean {
  if (albumId === null) {
    return false
  }

  if (albumId <= 0) {
    return false
  }

  return true
}
