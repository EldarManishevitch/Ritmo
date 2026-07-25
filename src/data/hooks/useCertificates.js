import { useQuery } from '@tanstack/react-query';
import { certificatesRepo } from '@/data/repositories/certificates.repo';
import { queryKeys } from '@/data/queryKeys';

export function useCertificatesList(sort = '-created_date', limit = 100, options = {}) {
  return useQuery({
    queryKey: queryKeys.certificates.list(sort, limit),
    queryFn: () => certificatesRepo.list(sort, limit),
    ...options,
  });
}
