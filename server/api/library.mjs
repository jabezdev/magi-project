                }
return false
            })

// Simple relevance sort
results.sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()

    // Exact match priority
    if (aTitle === q && bTitle !== q) return -1
    if (aTitle !== q && bTitle === q) return 1

    // Starts with priority
    if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1
    if (!aTitle.startsWith(q) && bTitle.startsWith(q)) return 1

    return 0
})

res.json(results.slice(0, 50))
        } catch (e) {
    console.error('Search failed:', e)
    res.status(500).json({ error: 'Search failed' })
}
    })

return router
}
